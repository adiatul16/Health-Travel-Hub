import React, { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { useUser } from "@clerk/react";
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
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#7C3AED",
    colorForeground: "#1e1030",
    colorMutedForeground: "#6b5e87",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#faf9ff",
    colorInputForeground: "#1e1030",
    colorNeutral: "#ede9f7",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-purple-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold text-2xl",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-900 font-semibold",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-purple-600 font-semibold hover:text-purple-800",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-purple-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "w-full border-2 border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/50 shadow-sm hover:shadow-md transition-all h-12 font-semibold text-gray-900",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white font-semibold",
    formFieldInput: "border-purple-100 bg-purple-50/30 text-gray-900 focus:border-purple-400",
    footerAction: "bg-purple-50/40 border-t border-purple-100",
    dividerLine: "bg-purple-100",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border-purple-100 bg-purple-50/30",
    formFieldRow: "gap-3",
    main: "px-6 py-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-purple-500 text-sm font-medium">The Healthcare Travel Operating System</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-purple-500 text-sm font-medium">Join thousands of patients saving on world-class healthcare</p>
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
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin" || user?.unsafeMetadata?.role === "admin";
  return (
    <AuthGate>
      {isAdmin ? (
        children
      ) : (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-500 mb-6">You don't have permission to view this page. Please contact your administrator if you believe this is an error.</p>
            <a href="/" className="inline-flex items-center justify-center rounded-xl bg-purple-600 text-white font-semibold px-6 py-2.5 hover:bg-purple-700 transition-colors">
              Back to Home
            </a>
          </div>
        </div>
      )}
    </AuthGate>
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
          <AuthGate>
            <Dashboard />
          </AuthGate>
        </Route>
        <Route path="/admin">
          <AdminGate>
            <Admin />
          </AdminGate>
        </Route>
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
