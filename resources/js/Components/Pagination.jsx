import { Link } from "@inertiajs/react";

export default function Pagination({ links }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1 mb-1">
      {links.map((link, key) => (
        link.url === null ? (
          <div
            key={key}
            className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <Link
            key={key}
            className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${
              link.active ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
            href={link.url}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        )
      ))}
    </div>
  );
}
