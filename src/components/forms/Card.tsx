interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      {title && (
        <h2 className="mb-4 text-xl font-semibold">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}