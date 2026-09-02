export default function ServiceNotes({ notes }) {
  return (
    <section className="detail-section" aria-labelledby="service-notes-title">
      <h2 id="service-notes-title" className="detail-section__title">
        Notes
      </h2>
      {notes ? (
        <p className="detail-section__body">{notes}</p>
      ) : (
        <p className="detail-section__empty">No notes.</p>
      )}
    </section>
  );
}
