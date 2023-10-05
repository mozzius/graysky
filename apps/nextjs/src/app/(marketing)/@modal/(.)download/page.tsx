export default function DownloadModal() {
  console.log("DownloadModal");
  return (
    <div className="fixed inset-0 z-40 grid place-items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur" />
      <div className="m-4 rounded bg-neutral-800 p-4">Download!</div>
    </div>
  );
}
