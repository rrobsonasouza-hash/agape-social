import { storage } from "@/lib/firebase/storage";

export default function Page() {
  console.log(storage);

  return (
    <main className="p-10">
      <h1>Storage OK ✅</h1>
    </main>
  );
}