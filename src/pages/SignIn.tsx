import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SignIn = () => {
  const [show, setShow] = useState(false);
  return (
    <Layout>
      <Seo title="Sign In" canonical="/signin" />
      <section className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
          <div className="grid gap-3">
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Email" />
            <div className="relative">
              <input type={show ? "text" : "password"} className="h-10 w-full rounded-md border bg-background px-3" placeholder="Password" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
            <Button className="w-full">Sign In</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">Continue with Google</Button>
              <Button variant="outline">Continue with Apple</Button>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              New here? <Link to="/signup" className="text-primary">Create an account</Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SignIn;
