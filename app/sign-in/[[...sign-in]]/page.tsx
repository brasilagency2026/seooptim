import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6 lg:px-8">
      <SignIn />
    </div>
  );
}
