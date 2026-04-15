import { Suspense } from "react";

import { EmailVerification } from "@/components/email-verification";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerification />
    </Suspense>
  );
}
