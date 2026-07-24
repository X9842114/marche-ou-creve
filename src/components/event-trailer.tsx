const TRAILER_ID = "YZ6yCrX8dyQ";

export function EventTrailer() {
  return (
    <section className="trailer-panel sk-panel overflow-hidden">
      <div className="trailer-head">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Trailer officiel
        </p>
        <p className="text-sm text-white/70">Marche ou Crève · H-47</p>
      </div>
      <div className="trailer-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${TRAILER_ID}?rel=0`}
          title="Trailer Marche ou Crève"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
