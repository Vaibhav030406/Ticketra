import { useEffect, useState } from "react";

const RandomEventImage: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 4) + 1;
    setImageSrc(`/event-image-${randomIndex}.webp`);
  }, []);

  if (!imageSrc) return null;

  return <img src={imageSrc} alt="Random Event" className="object-cover" />;
};

export default RandomEventImage;
