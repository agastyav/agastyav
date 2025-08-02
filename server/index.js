const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// More strict rate limiting for write operations
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 write requests per minute
  message: 'Too many write requests from this IP, please try again later.'
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Authorization middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ error: 'User profile not found' });
      }

      if (!roles.includes(profile.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = profile.role;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Series routes
app.get('/api/series', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('title');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/series/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content units routes
app.get('/api/series/:seriesId/units', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_units')
      .select('*')
      .eq('series_id', req.params.seriesId)
      .order('number');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jump point finder
app.get('/api/series/:seriesId/jump', async (req, res) => {
  try {
    const { medium, number } = req.query;
    
    if (!medium || !number) {
      return res.status(400).json({ error: 'Medium and number are required' });
    }

    // Find the unit
    const { data: unit, error: unitError } = await supabase
      .from('content_units')
      .select('*')
      .eq('series_id', req.params.seriesId)
      .eq('medium', medium)
      .eq('number', parseInt(number))
      .single();

    if (unitError || !unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Find mappings for this unit
    const { data: mappings, error: mappingsError } = await supabase
      .from('mappings')
      .select(`
        *,
        from_unit:content_units!mappings_from_unit_id_fkey(*),
        to_unit:content_units!mappings_to_unit_id_fkey(*)
      `)
      .or(`from_unit_id.eq.${unit.id},to_unit_id.eq.${unit.id}`)
      .eq('status', 'approved');

    if (mappingsError) throw mappingsError;

    // Group by medium
    const results = {};
    mappings.forEach(mapping => {
      const targetUnit = mapping.from_unit_id === unit.id ? mapping.to_unit : mapping.from_unit;
      if (!results[targetUnit.medium]) {
        results[targetUnit.medium] = [];
      }
      results[targetUnit.medium].push({
        unit: targetUnit,
        confidence: mapping.confidence,
        notes: mapping.notes
      });
    });

    res.json({
      source_unit: unit,
      mappings: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mapping routes (require authentication)
app.post('/api/mappings', writeLimiter, authenticateUser, async (req, res) => {
  try {
    const { from_unit_id, to_unit_id, confidence, notes } = req.body;

    // Validate input
    if (!from_unit_id || !to_unit_id || confidence < 0 || confidence > 100) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Check if mapping already exists
    const { data: existing, error: checkError } = await supabase
      .from('mappings')
      .select('*')
      .or(`and(from_unit_id.eq.${from_unit_id},to_unit_id.eq.${to_unit_id}),and(from_unit_id.eq.${to_unit_id},to_unit_id.eq.${from_unit_id})`)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Mapping already exists' });
    }

    // Create mapping
    const { data, error } = await supabase
      .from('mappings')
      .insert({
        series_id: req.body.series_id,
        from_unit_id,
        to_unit_id,
        confidence,
        notes,
        status: 'pending',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log contribution
    await supabase
      .from('contribution_logs')
      .insert({
        user_id: req.user.id,
        mapping_id: data.id,
        action: 'submitted',
        points: 10
      });

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Moderation routes (require moderator/admin role)
app.get('/api/mappings/pending', authenticateUser, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mappings')
      .select(`
        *,
        from_unit:content_units!mappings_from_unit_id_fkey(*),
        to_unit:content_units!mappings_to_unit_id_fkey(*),
        creator:users!mappings_created_by_fkey(display_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/mappings/:id/status', writeLimiter, authenticateUser, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('mappings')
      .update({ 
        status,
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Award/penalize points
    const points = status === 'approved' ? 40 : -20;
    await supabase
      .from('contribution_logs')
      .insert({
        user_id: data.created_by,
        mapping_id: data.id,
        action: status,
        points
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rating routes
app.post('/api/ratings', writeLimiter, authenticateUser, async (req, res) => {
  try {
    const { arc_id, medium, stars, comment } = req.body;

    if (!arc_id || !medium || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Check if user already rated this arc/medium
    const { data: existing, error: checkError } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('arc_id', arc_id)
      .eq('medium', medium)
      .single();

    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update({ stars, comment, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          user_id: req.user.id,
          arc_id,
          medium,
          stars,
          comment
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, points, role')
      .order('points', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User profile
app.get('/api/users/profile', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        contributions:contribution_logs(count),
        badges:user_badges(
          badge:badges(*)
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Arc routes
app.get('/api/arcs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('arcs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/arcs/:id/ratings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('arc_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});