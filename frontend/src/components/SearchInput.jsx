import { useId, useState } from 'react';

// Used on the home page and the search page
export default function SearchInput({ initialValue = '', onSearch }) {
  const [value, setValue] = useState(initialValue);
  // useId gives the input a unique id so the label can point at it with htmlFor
  const inputId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-2">
      <label htmlFor={inputId} className="label text-center">
        Search by name, username, email, description, album or #hashtag
      </label>
      <div className="flex overflow-hidden rounded-full bg-polaroid shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
        <input
          id={inputId}
          type="search"
          className="min-w-0 flex-1 bg-transparent px-6 py-4 text-lg focus:outline-none"
          placeholder="e.g. alissa or #safari"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="bg-burnt px-6 font-bold text-beige transition-colors hover:bg-burnt-dark">Search</button>
      </div>
    </form>
  );
}
