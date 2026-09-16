import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginMutation } from "../api";
import { setSession, useAppDispatch, useAppSelector } from "../authSlice";

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
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else if (user.role?.name === "ADMIN") {
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
        dispatch(setSession(response.data));
        const authUser = response.data.user;
        const from = (location.state as { from?: { pathname: string } })?.from
          ?.pathname;
        if (from && from !== "/login") {
          navigate(from, { replace: true });
        } else if (authUser.role?.name === "ADMIN") {
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
    <main className="min-h-screen w-full bg-surface">
      <div className="flex flex-col w-full">
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          {/* LEFT PANEL: Enterprise Operations & Telemetry Graphic (52% on Desktop) */}
          <div
            className="w-full lg:w-[52%] bg-gradient-to-br from-primary via-primary-container to-[#0b1c30] text-on-primary flex flex-col p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl justify-center"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Subtle Decorative Ambient Geometry */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-primary-fixed/5 blur-2xl pointer-events-none" />

            {/* Top Header & Brand Identifier */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-5 pt-2">
              <div className="inline-flex items-center justify-center">
                <div className="flex items-center justify-center p-2">
                  <img
                    alt="Happiness Connected Logo"
                    className="h-11 w-auto object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXbFXF3HBfDtzYVBN2cknzNdVneTav4B16FMqCa2Xi_LHiBs3rT-xda8MISgQIXhri8q_FJfQCeDX-9zHOwOB7Wi-nUGAea4cpkSfZZaXh9wlctu-GTPfXPvH6QdzWy6lZ59sQ3CMgaEUe8tQeU78bXWIN-gDe_b4ntmbY4gHJGUjFtReFy_qf-olktvWd2K85kLB6JYkTzhVbcfrSJYFmiT0mNHX0Ojwu5PRznJ_8-N3EaMnpV5K7swaMQqMcLC1wJQ"
                    style={{ mixBlendMode: "screen" }}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-1 text-center flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] leading-none font-black tracking-tight text-white uppercase drop-shadow-sm">
                  RTS HELP DESK
                </h1>
                <p className="font-body-md text-base sm:text-lg text-surface-variant font-normal max-w-md">
                  Ticket Management
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Authentication Form Pane (48% on Desktop) */}
          <div className="w-full lg:w-[48%] bg-surface-container-lowest flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
            <div className="w-full max-w-sm flex flex-col">
              {/* Header */}
              <div className="mb-6 text-left">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  Sign in
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Enter your credentials to access your ticket queue
                </p>
              </div>

              {/* Inline Error Alert Notification */}
              {displayError && (
                <div
                  className="mb-5 flex items-center gap-2.5 p-3 rounded-md bg-red-50 text-red-700 shadow-sm transition-opacity duration-200"
                  id="error-alert"
                  role="alert"
                >
                  <span className="material-symbols-outlined text-[18px] text-red-600 flex-shrink-0">
                    error
                  </span>
                  <span className="font-body-sm text-body-sm font-medium">
                    {displayError}
                  </span>
                </div>
              )}

              {/* Form Elements */}
              <form
                className="space-y-4"
                id="login-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                {/* Username Field */}
                <div className="space-y-1.5 text-left">
                  <label
                    className="block font-body-sm text-body-sm font-medium text-on-surface-variant"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <input
                      {...register("username", {
                        onChange: handleInputChange,
                      })}
                      autoComplete="username"
                      className="w-full h-10 px-3 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-md shadow-sm outline-none transition-all placeholder:text-outline/70 focus:bg-surface-container-low"
                      id="username"
                      placeholder="e.g. jdoe or emp_id"
                      type="text"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <label
                    className="block font-body-sm text-body-sm font-medium text-on-surface-variant"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      {...register("password", {
                        onChange: handleInputChange,
                      })}
                      autoComplete="current-password"
                      className="w-full h-10 pl-3 pr-10 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-md shadow-sm outline-none transition-all placeholder:text-outline/70 focus:bg-surface-container-low"
                      id="password"
                      placeholder="••••••••••••"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 text-outline hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded focus:outline-none"
                      id="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[19px]"
                        id="eye-icon"
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <button
                    className={`w-full h-11 bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold rounded-md shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-secondary-container focus:ring-offset-2 ${
                      loginMutation.isPending
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={loginMutation.isPending}
                    id="submit-btn"
                    type="submit"
                  >
                    <span>
                      {loginMutation.isPending ? "Logging In..." : "Log In"}
                    </span>
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginForm;
