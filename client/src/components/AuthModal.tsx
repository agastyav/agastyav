import { Fragment, useState } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

const signInSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const signUpSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  displayName: yup.string().required('Display name is required'),
})

type SignInFormData = yup.InferType<typeof signInSchema>
type SignUpFormData = yup.InferType<typeof signUpSchema>

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [selectedTab, setSelectedTab] = useState(0)
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const signInForm = useForm<SignInFormData>({
    resolver: yupResolver(signInSchema),
  })

  const signUpForm = useForm<SignUpFormData>({
    resolver: yupResolver(signUpSchema),
  })

  const handleSignIn = async (data: SignInFormData) => {
    try {
      await signIn(data.email, data.password)
      onClose()
      signInForm.reset()
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleSignUp = async (data: SignUpFormData) => {
    try {
      await signUp(data.email, data.password, data.displayName)
      onClose()
      signUpForm.reset()
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      onClose()
    } catch (error) {
      // Error is handled by the auth context
    }
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                      Welcome to MangaMapper
                    </Dialog.Title>

                    <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                      <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                              selected
                                ? 'bg-white text-primary-700 shadow'
                                : 'text-gray-700 hover:text-primary-600'
                            }`
                          }
                        >
                          Sign In
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                              selected
                                ? 'bg-white text-primary-700 shadow'
                                : 'text-gray-700 hover:text-primary-600'
                            }`
                          }
                        >
                          Sign Up
                        </Tab>
                      </Tab.List>

                      <Tab.Panels>
                        {/* Sign In Panel */}
                        <Tab.Panel>
                          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                            <div>
                              <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700">
                                Email
                              </label>
                              <input
                                type="email"
                                id="signin-email"
                                {...signInForm.register('email')}
                                className="input mt-1"
                                placeholder="Enter your email"
                              />
                              {signInForm.formState.errors.email && (
                                <p className="mt-1 text-sm text-danger-600">{signInForm.formState.errors.email.message}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">
                                Password
                              </label>
                              <input
                                type="password"
                                id="signin-password"
                                {...signInForm.register('password')}
                                className="input mt-1"
                                placeholder="Enter your password"
                              />
                              {signInForm.formState.errors.password && (
                                <p className="mt-1 text-sm text-danger-600">{signInForm.formState.errors.password.message}</p>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={signInForm.formState.isSubmitting}
                              className="w-full btn-primary"
                            >
                              {signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                            </button>
                          </form>
                        </Tab.Panel>

                        {/* Sign Up Panel */}
                        <Tab.Panel>
                          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                            <div>
                              <label htmlFor="signup-display-name" className="block text-sm font-medium text-gray-700">
                                Display Name
                              </label>
                              <input
                                type="text"
                                id="signup-display-name"
                                {...signUpForm.register('displayName')}
                                className="input mt-1"
                                placeholder="Enter your display name"
                              />
                              {signUpForm.formState.errors.displayName && (
                                <p className="mt-1 text-sm text-danger-600">{signUpForm.formState.errors.displayName.message}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                                Email
                              </label>
                              <input
                                type="email"
                                id="signup-email"
                                {...signUpForm.register('email')}
                                className="input mt-1"
                                placeholder="Enter your email"
                              />
                              {signUpForm.formState.errors.email && (
                                <p className="mt-1 text-sm text-danger-600">{signUpForm.formState.errors.email.message}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                                Password
                              </label>
                              <input
                                type="password"
                                id="signup-password"
                                {...signUpForm.register('password')}
                                className="input mt-1"
                                placeholder="Enter your password"
                              />
                              {signUpForm.formState.errors.password && (
                                <p className="mt-1 text-sm text-danger-600">{signUpForm.formState.errors.password.message}</p>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={signUpForm.formState.isSubmitting}
                              className="w-full btn-primary"
                            >
                              {signUpForm.formState.isSubmitting ? 'Creating account...' : 'Sign Up'}
                            </button>
                          </form>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>
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