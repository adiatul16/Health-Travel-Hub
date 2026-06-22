import React, { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Treatments from "@/pages/treatments";
import Clinics from "@/pages/clinics";
import ClinicDetail from "@/pages/clinic-detail";
import Destinations from "@/pages/destinations";
import Packages from "@/pages/packages";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import ClinicLogin from "@/pages/clinic-login";
import ClinicDashboard from "@/pages/clinic-dashboard";
import VerifyPage from "@/pages/verify";
import { PatientPortalShell, ClinicPortalShell, AdminPortalShell } from "@/components/portal-shells";

const queryClient = new QueryClient();

const ADMIN_KEY = "mb_admin";
const CLINIC_KEY = "mb_clinic";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo-vitavia.png`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#0F4C81",
    colorForeground: "#1e293b",
    colorMutedForeground: "#5a6b7c",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f4f7fa",
    colorInputForeground: "#1e293b",
    colorNeutral: "#e5e7eb",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#0F4C81]/20",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold text-2xl",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-900 font-semibold",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-[#0F4C81] font-semibold hover:text-[#1F7A8C]",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-[#0F4C81]",
    formFieldSuccessText: "text-[#00A878]",
    alertText: "text-gray-700",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "w-full border-2 border-[#0F4C81]/30 hover:border-[#0F4C81] bg-white hover:bg-[#0F4C81]/5 shadow-sm hover:shadow-md transition-all h-12 font-semibold text-gray-900",
    formButtonPrimary: "bg-[#0F4C81] hover:bg-[#1F7A8C] text-white font-semibold",
    formFieldInput: "border-[#0F4C81]/20 bg-[#0F4C81]/5 text-gray-900 focus:border-[#0F4C81]",
    footerAction: "bg-[#0F4C81]/5 border-t border-[#0F4C81]/10",
    dividerLine: "bg-[#0F4C81]/10",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border-[#0F4C81]/20 bg-[#0F4C81]/5",
    formFieldRow: "gap-3",
    main: "px-6 py-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#F4F7FA] to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={`${basePath}/logo-vitavia.png`} alt="VitaVia" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-[#1F7A8C] text-sm font-medium">The Healthcare Travel Operating System</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#F4F7FA] to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={`${basePath}/logo-vitavia.png`} alt="VitaVia" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-[#1F7A8C] text-sm font-medium">Join thousands of patients saving on world-class healthcare</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const isAdmin = sessionStorage.getItem(ADMIN_KEY) === "1";
  return isAdmin ? children : <Redirect to="/admin-login" />;
}

function ClinicGate({ children }: { children: React.ReactNode }) {
  const isClinic = sessionStorage.getItem(CLINIC_KEY) === "1";
  return isClinic ? children : <Redirect to="/clinic-login" />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/treatments" component={Treatments} />
        <Route path="/clinics" component={Clinics} />
        <Route path="/clinics/:id" component={ClinicDetail} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/packages" component={Packages} />
        <Route path="/dashboard">
          <AuthGate>
            <PatientPortalShell>
              <Dashboard />
            </PatientPortalShell>
          </AuthGate>
        </Route>
        <Route path="/clinic-login" component={ClinicLogin} />
        <Route path="/clinic-dashboard">
          <ClinicGate>
            <ClinicPortalShell>
              <ClinicDashboard />
            </ClinicPortalShell>
          </ClinicGate>
        </Route>
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/admin">
          <AdminGate>
            <AdminPortalShell>
              <Admin />
            </AdminPortalShell>
          </AdminGate>
        </Route>
        <Route path="/verify" component={VerifyPage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to VitaVia",
            subtitle: "Sign in to your account",
          },
        },
        signUp: {
          start: {
            title: "Create your VitaVia account",
            subtitle: "Start your healthcare journey today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
