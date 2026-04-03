import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-foreground">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-default-500">
        The page you are looking for does not exist.
      </p>
      <Link className="text-primary underline" href="/">
        Go home
      </Link>
    </div>
  );
}
