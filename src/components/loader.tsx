export default function Loader({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 loader-dot" />
        <div className="w-3 h-3 rounded-full bg-blue-500 loader-dot" />
        <div className="w-3 h-3 rounded-full bg-blue-500 loader-dot" />
      </div>
      <p className="text-gray-500 text-sm animate-pulse">{message}</p>
    </div>
  );
}
