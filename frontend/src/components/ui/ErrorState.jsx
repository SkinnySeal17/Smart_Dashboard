import Button from "./Button";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state__msg">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
