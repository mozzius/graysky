export default function ChildSafetyPage() {
  return (
    <div className="container mx-auto max-w-4xl pt-8">
      <h1 className="text-2xl">CSAE Reporting Policy</h1>
      <p className="mt-4">
        Our app relies on Bluesky’s community moderation services to detect and
        respond to harmful content, including Child Sexual Abuse and
        Exploitation (CSAE).
      </p>
      <ol className="mt-4 list-inside list-decimal space-y-2">
        <li>
          <strong>Report in-app:</strong> Use the built-in reporting tools to
          flag the content directly to Bluesky’s moderation team for immediate
          review.
        </li>
        <li>
          <strong>Escalate if needed:</strong> If you believe the report was not
          handled appropriately, or if you are unable to report via the app,
          please contact us directly at{" "}
          <a
            className="underline underline-offset-4"
            href="mailto:hello@graysky.app"
          >
            hello@graysky.app
          </a>
          .
        </li>
      </ol>
      <p className="mt-4">
        We take CSAE concerns extremely seriously. Reports received at our email
        will be escalated and acted upon without delay.
      </p>
      <p className="mt-4">
        If you believe a child is in immediate danger, please also contact your
        local law enforcement authority.
      </p>
    </div>
  );
}
