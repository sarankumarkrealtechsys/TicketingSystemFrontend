import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginMutation, authKeys } from "../api";
import { setSession, useAppDispatch, useAppSelector } from "../authSlice";
import { queryClient } from "@/app/providers";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && user) {
      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      const roleName = (user.role?.name || "").toUpperCase();
      const isAdmin = roleName === "ADMIN";
      const isGenericRoute =
        !from ||
        from === "/login" ||
        from === "/dashboard" ||
        from === "/admin/dashboard";

      if (!isGenericRoute) {
        navigate(from, { replace: true });
      } else if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [status, user, navigate, location]);

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        // Isolate authentication session in this browser tab
        if (response.data?.token) {
          sessionStorage.setItem("rts_auth_token", response.data.token);
        }

        // Reset all stale query error states and set fresh active session
        queryClient.resetQueries({ queryKey: authKeys.all });
        queryClient.setQueryData(authKeys.me(), response);
        dispatch(setSession(response.data));

        const authUser = response.data.user;
        const roleName = (authUser.role?.name || "").toUpperCase();
        const isAdmin = roleName === "ADMIN";

        const from = (location.state as { from?: { pathname: string } })?.from
          ?.pathname;
        const isGenericRoute =
          !from ||
          from === "/login" ||
          from === "/dashboard" ||
          from === "/admin/dashboard";

        if (!isGenericRoute) {
          navigate(from, { replace: true });
        } else if (isAdmin) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      },
      onError: (error) => {
        // Log technical / internal errors strictly to developer console
        console.error("Authentication error:", error);

        // Display sanitized user-friendly error in the UI
        if (error.response?.status === 401) {
          setServerError("Invalid username or password");
        } else if (error.response?.status === 429) {
          setServerError("Too many login attempts. Please wait a few moments.");
        } else {
          setServerError("Unable to complete request. Please try again later.");
        }
      },
    });
  };

  // Clear error alert as soon as the user starts editing any field
  const handleInputChange = () => {
    if (serverError) {
      setServerError(null);
    }
  };

  // Determine active display error (client validation or server error)
  const displayError =
    serverError || errors.username?.message || errors.password?.message || null;

  return (
    <main
      className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans antialiased text-[#1A1A1A] bg-[#FFFFFF] select-none"
      data-purpose="login-split-layout"
    >
      {/* BEGIN: LeftBrandingColumn */}
      <section
        className="w-full md:w-1/2 min-h-[320px] md:min-h-screen brand-glow flex flex-col items-center justify-center relative pt-12 pb-8 px-6 md:p-8 select-none flex-shrink-0"
        data-purpose="brand-identity-panel"
      >
        {/* Decorative subtle backdrop overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        />
        {/* Center Logo & Name Group */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo Display Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl ring-1 ring-white/20 flex items-center justify-center mb-6">
            <img
              alt="RTS Help Desk Logo"
              className="h-20 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXwZ_VrvCp1ZIZ2h1QCbeAv3OmJoDruqMQnyJn7fkGpZwOXobWH0ZWAlOKnhecRqBX2ay5u8p4JZwZGoIkXDmK6NMprIOHVlut7OQJIz_Y-53oyaGQdcFlBLNaGVhcma5W1RLLHbXCGSQH7dkVzGINwTvpkEejRi5Vc8qTqdBe-bcp4S8kbXx2F-5SxbJcET1WVWQ0FOwwHtm9UeGK1olir6AfRgVXEZO2hASeNa0gvRpkP7EaXXSHYkqkkmI3jsnqeQ"
            />
          </div>
          {/* Product Branding Headline */}
          <h1 className="text-white text-2xl font-bold tracking-wider uppercase drop-shadow-sm">
            RTS HELP DESK
          </h1>
        </div>
      </section>
      {/* END: LeftBrandingColumn */}

      {/* BEGIN: RightAuthColumn */}
      <section
        className="w-full md:w-1/2 min-h-[calc(100vh-320px)] md:min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6 sm:p-10 md:p-12 overflow-y-auto"
        data-purpose="authentication-panel"
      >
        {/* Authentication Card Container */}
        <div
          className="w-full max-w-[440px] bg-white rounded-[12px] p-8 sm:p-10 shadow-sm border border-[#EEEEEE] animate-enter"
          data-purpose="login-card"
        >
          {/* Header Text */}
          <header className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#555555] mt-1">
              Sign in to continue to your dashboard
            </p>
          </header>

          {/* Inline Error Alert Notification */}
          {displayError && (
            <div
              className="mb-5 flex items-center gap-2.5 p-3 rounded-[8px] bg-red-50 text-red-700 border border-red-200 text-sm font-medium shadow-sm transition-opacity duration-200"
              id="error-alert"
              role="alert"
            >
              <svg
                className="w-4 h-4 text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">{displayError}</span>
            </div>
          )}

          {/* Login Form */}
          <form
            className="space-y-5"
            id="loginForm"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Username Input Field */}
            <div data-purpose="field-group-username">
              <label
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
                htmlFor="username"
              >
                Username
              </label>
              <input
                {...register("username", {
                  onChange: handleInputChange,
                })}
                autoComplete="username"
                className="w-full h-11 px-3.5 rounded-[8px] border border-[#DDDDDD] bg-white text-[#1A1A1A] text-sm placeholder-[#9E9E9E] transition-all duration-150 focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/20"
                id="username"
                name="username"
                placeholder="Enter your enterprise username"
                type="text"
              />
            </div>

            {/* Password Input Field with Interactive Eye Toggle */}
            <div data-purpose="field-group-password">
              <label
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    onChange: handleInputChange,
                  })}
                  autoComplete="current-password"
                  className="w-full h-11 pl-3.5 pr-11 rounded-[8px] border border-[#DDDDDD] bg-white text-[#1A1A1A] text-sm placeholder-[#9E9E9E] transition-all duration-150 focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/20"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                {/* Toggle Show/Hide Password Button */}
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#777777] hover:text-[#1A1A1A] transition-colors focus:outline-none"
                  id="togglePassword"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      id="eyeSlashIcon"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      id="eyeIcon"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Primary Submit Action Button */}
            <div className="pt-2">
              <button
                className={`w-full h-11 bg-[#1F3864] hover:bg-[#2E74B5] active:scale-[0.98] transition-all duration-150 text-white font-medium text-sm rounded-[8px] flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:ring-offset-2 ${
                  loginMutation.isPending ? "opacity-75 cursor-not-allowed" : ""
                }`}
                disabled={loginMutation.isPending}
                id="submit-btn"
                type="submit"
              >
                <span>
                  {loginMutation.isPending ? "Logging In..." : "Login"}
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </section>
      {/* END: RightAuthColumn */}
    </main>
  );
};

export default LoginForm;
