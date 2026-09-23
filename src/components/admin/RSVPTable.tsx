import { Flag } from "lucide-react";
import type { RsvpResponse } from "../../lib/admin";
import { EVENT } from "../../lib/event";
const submittedDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT.timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
function Status({ attending }: { attending: boolean }) {
  return (
    <span className={`admin-badge ${attending ? "going" : "not-going"}`}>
      {attending ? "Going" : "Not Going"}
    </span>
  );
}
export function RSVPTable({ responses }: { responses: RsvpResponse[] }) {
  if (!responses.length)
    return (
      <div className="admin-empty">
        <Flag size={30} aria-hidden="true" />
        <h3>No responses yet</h3>
        <p>The starting grid is waiting for its first guest.</p>
      </div>
    );
  return (
    <>
      <div className="admin-table-desktop">
        <table className="admin-table">
          <caption className="sr-only">
            RSVP responses, newest first. Guests are additional people.
          </caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Guests</th>
              <th scope="col">Message</th>
              <th scope="col">Date Submitted</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.id}>
                <th scope="row">{response.name}</th>
                <td>
                  <Status attending={response.attending} />
                </td>
                <td>{response.attending ? response.guest_count : 0}</td>
                <td className="admin-message">{response.message || "—"}</td>
                <td>
                  <time dateTime={response.created_at}>
                    {submittedDate(response.created_at)}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-response-cards">
        {responses.map((response) => (
          <article key={response.id} className="admin-response-card">
            <div className="admin-response-heading">
              <h3>{response.name}</h3>
              <Status attending={response.attending} />
            </div>
            <dl>
              <div>
                <dt>Guests</dt>
                <dd>
                  {response.attending ? response.guest_count : 0} additional
                </dd>
              </div>
              <div>
                <dt>Date Submitted</dt>
                <dd>
                  <time dateTime={response.created_at}>
                    {submittedDate(response.created_at)}
                  </time>
                </dd>
              </div>
            </dl>
            {response.message && (
              <p className="admin-mobile-message">{response.message}</p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
