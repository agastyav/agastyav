import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import apiClient, { ContentUnit } from '../lib/api'

interface ContributeModalProps {
  open: boolean
  onClose: () => void
  seriesId: string
  sourceUnit: ContentUnit
}

const contributeSchema = yup.object({
  to_unit_id: yup.string().required('Please select a target unit'),
  confidence: yup.number().min(0).max(100).required('Confidence is required'),
  notes: yup.string().optional(),
})

type ContributeFormData = yup.InferType<typeof contributeSchema>

const mediumLabels = {
  light_novel: 'Light Novel',
  web_novel: 'Web Novel',
  manga: 'Manga',
  anime: 'Anime',
}

export default function ContributeModal({ open, onClose, seriesId, sourceUnit }: ContributeModalProps) {
  const [selectedMedium, setSelectedMedium] = useState<keyof typeof mediumLabels>('manga')
  const queryClient = useQueryClient()

  const { data: units = [], isLoading: unitsLoading } = useQuery(
    ['series-units', seriesId],
    () => apiClient.getSeriesUnits(seriesId),
    {
      enabled: open,
    }
  )

  const createMappingMutation = useMutation(
    (data: ContributeFormData) => apiClient.createMapping({
      series_id: seriesId,
      from_unit_id: sourceUnit.id,
      to_unit_id: data.to_unit_id,
      confidence: data.confidence,
      notes: data.notes,
    }),
    {
      onSuccess: () => {
        toast.success('Mapping submitted successfully! It will be reviewed by moderators.')
        queryClient.invalidateQueries(['jump', seriesId])
        onClose()
        form.reset()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit mapping')
      },
    }
  )

  const form = useForm<ContributeFormData>({
    resolver: yupResolver(contributeSchema),
    defaultValues: {
      confidence: 80,
    },
  })

  const filteredUnits = units.filter(unit => 
    unit.medium === selectedMedium && unit.id !== sourceUnit.id
  )

  const handleSubmit = (data: ContributeFormData) => {
    createMappingMutation.mutate(data)
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-6">
                      Contribute a Mapping
                    </Dialog.Title>

                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* Source Unit Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">From:</h4>
                        <p className="text-gray-600">
                          {mediumLabels[sourceUnit.medium]} {sourceUnit.number}
                          {sourceUnit.title && ` - ${sourceUnit.title}`}
                        </p>
                      </div>

                      {/* Target Medium Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Medium
                        </label>
                        <select
                          value={selectedMedium}
                          onChange={(e) => setSelectedMedium(e.target.value as keyof typeof mediumLabels)}
                          className="input"
                        >
                          {Object.entries(mediumLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target Unit Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Unit
                        </label>
                        {unitsLoading ? (
                          <div className="input text-center text-gray-500">Loading units...</div>
                        ) : filteredUnits.length > 0 ? (
                          <select
                            {...form.register('to_unit_id')}
                            className="input"
                          >
                            <option value="">Select a unit...</option>
                            {filteredUnits.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.number} {unit.title ? `- ${unit.title}` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="input text-center text-gray-500">
                            No {mediumLabels[selectedMedium]} units available
                          </div>
                        )}
                        {form.formState.errors.to_unit_id && (
                          <p className="mt-1 text-sm text-danger-600">
                            {form.formState.errors.to_unit_id.message}
                          </p>
                        )}
                      </div>

                      {/* Confidence Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confidence Level: {form.watch('confidence')}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          {...form.register('confidence', { valueAsNumber: true })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                        </div>
                        {form.formState.errors.confidence && (
                          <p className="mt-1 text-sm text-danger-600">
                            {form.formState.errors.confidence.message}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          {...form.register('notes')}
                          rows={3}
                          className="input"
                          placeholder="Add any additional notes about this mapping..."
                        />
                        {form.formState.errors.notes && (
                          <p className="mt-1 text-sm text-danger-600">
                            {form.formState.errors.notes.message}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createMappingMutation.isLoading}
                          className="btn-primary"
                        >
                          {createMappingMutation.isLoading ? 'Submitting...' : 'Submit Mapping'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}