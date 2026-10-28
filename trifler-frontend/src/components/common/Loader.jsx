export default function Loader({ message = "Loading..." }) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
