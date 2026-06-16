import React, { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

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
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#0ea5e9",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#0f172a",
    colorNeutral: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold text-2xl",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-sky-500 font-semibold hover:text-sky-600",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-sky-500",
    formFieldSuccessText: "text-green-600",
    alertText: "text-slate-700",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-slate-200 hover:border-slate-300 bg-white",
    formButtonPrimary: "bg-sky-500 hover:bg-sky-600 text-white font-semibold",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-900 focus:border-sky-400",
    footerAction: "bg-slate-50 border-t border-slate-100",
    dividerLine: "bg-slate-200",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border-slate-200 bg-slate-50",
    formFieldRow: "gap-3",
    main: "px-6 py-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm">The Healthcare Travel Operating System</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm">Join thousands of patients saving on world-class healthcare</p>
        </div>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
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
          <Show when="signed-in">
            <Dashboard />
          </Show>
          <Show when="signed-out">
            <SignInPage />
          </Show>
        </Route>
        <Route path="/admin" component={Admin} />
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
            title: "Welcome back to MediBridge",
            subtitle: "Sign in to your account",
          },
        },
        signUp: {
          start: {
            title: "Create your MediBridge account",
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
