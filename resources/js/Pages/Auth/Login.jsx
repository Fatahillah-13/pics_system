import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign In — PICS System" />
            <div className="min-h-screen flex">
                {/* Left Panel — Branding */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-800 flex-col justify-between p-14 relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5"></div>
                    <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-white/5"></div>
                    <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-blue-600/30"></div>

                    {/* Top: Logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-blue-800" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 10c0-1.657 2.239-3 5-3s5 1.343 5 3H7z" />
                            </svg>
                        </div>
                        <span className="text-white text-lg font-bold tracking-wide">PICS System</span>
                    </div>

                    {/* Middle: Headline */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-white/80 text-xs font-medium tracking-wider uppercase">ID Card Management</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Photo & ID Card<br />Printing System
                        </h1>
                        <p className="text-blue-200 text-base leading-relaxed max-w-sm">
                            Streamline your employee onboarding — manage photos, NIK data, and print professional ID cards in minutes.
                        </p>
                    </div>

                    {/* Bottom: Footer */}
                    <p className="relative z-10 text-blue-300/60 text-xs">
                        &copy; {new Date().getFullYear()} PICS System. All rights reserved.
                    </p>
                </div>

                {/* Right Panel — Login Form */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="flex items-center gap-3 mb-8 lg:hidden">
                            <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 10c0-1.657 2.239-3 5-3s5 1.343 5 3H7z" />
                                </svg>
                            </div>
                            <span className="text-blue-800 text-lg font-bold">PICS System</span>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                                <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
                            </div>

                            {status && (
                                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                    <InputError message={errors.email} className="mt-1.5" />
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>

                                {/* Remember me */}
                                <div className="flex items-center gap-2.5">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                                        Remember me for 30 days
                                    </label>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
                                >
                                    {processing ? 'Signing in…' : 'Sign In'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
