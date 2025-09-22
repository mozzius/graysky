export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl pt-8">
      <h1 className="text-2xl">Support</h1>
      <p className="mt-4">
        If you need help, email us at{" "}
        <a
          className="underline underline-offset-4"
          href="mailto:support@graysky.app"
        >
          support@graysky.app
        </a>{" "}
        with a description of your issue and information about how we can help
        you.
      </p>
    </div>
  );
}
