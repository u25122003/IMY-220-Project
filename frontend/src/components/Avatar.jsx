//shows users profile pic as a circle


export default function Avatar({ src, name, className = 'h-10 w-10' }) {
  return (
    <img
      src={src || '/assets/avatars/default.svg'}
      alt={name ? `${name}'s avatar` : 'Avatar'}
      className={`shrink-0 rounded-full bg-sand object-cover ${className}`}
    />
  );
}
