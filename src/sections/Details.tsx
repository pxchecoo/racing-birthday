import { useEvent } from "../hooks/useEvent";
import { ArrowUpRight, CalendarPlus, MapPin } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { Magnetic } from "../components/Magnetic";
import { DIRECTIONS_URL, downloadCalendar } from "../lib/event";
export function Details() {
  const { settings, labels } = useEvent();
  return (
    <>
      <section
        className="section event-section"
        id="details"
        aria-labelledby="details-title"
      >
        <Reveal>
          <div className="section-label">
            <span>01 / THE OCCASION</span>
            <span className="checkers" aria-hidden="true" />
          </div>
          <div className="event-grid">
            <div>
              <h2 id="details-title">
                THE RACE
                <br />
                <span className="text-metal">BEGINS.</span>
              </h2>
              <p className="body-copy">
                Good people. Great energy. One unforgettable lap.
                <br />
                Bring yourself. We’ll take care of the celebration.
              </p>
            </div>
            <div className="date-block">
              <div className="date-top">
                <span>{labels.weekday}</span>
                <span>{labels.year}</span>
              </div>
              <div className="big-date">
                {labels.day}
                <span>{labels.month}</span>
              </div>
              <div className="time-row">
                <span>{labels.time}</span>
                <span>PUERTO RICO · AST</span>
              </div>
              <button
                className="text-button"
                onClick={() => downloadCalendar(settings)}
              >
                Save the date <CalendarPlus size={18} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>
      <section
        className="section location-section"
        id="location"
        aria-labelledby="location-title"
      >
        <Reveal>
          <div className="section-label">
            <span>02 / THE MEETING POINT</span>
            <span>18° N / 66° W · PUERTO RICO</span>
          </div>
          <div className="location-card">
            <div className="location-copy">
              <span className="eyebrow">YOUR DESTINATION</span>
              <h2 id="location-title">
                Meet at the
                <br />
                <span className="text-metal">starting line.</span>
              </h2>
              <address>
                Avenida Diego Velázquez N-12
                <br />
                <span>El Conquistador, Puerto Rico</span>
              </address>
              <Magnetic>
                <a
                  className="button button-white"
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions <ArrowUpRight size={18} />
                </a>
              </Magnetic>
              <p className="map-note">Opens in Google Maps</p>
            </div>
            <div className="location-art" aria-hidden="true">
              <div className="map-grid" />
              <svg className="track-lines" viewBox="0 0 560 460" fill="none">
                <path
                  d="M-40 420L105 278Q145 243 212 266L300 297Q358 317 388 273L440 201Q477 153 581 166"
                  stroke="#33363c"
                  strokeWidth="54"
                />
                <path
                  d="M-40 420L105 278Q145 243 212 266L300 297Q358 317 388 273L440 201Q477 153 581 166"
                  stroke="#111317"
                  strokeWidth="50"
                />
                <path
                  d="M-40 420L105 278Q145 243 212 266L300 297Q358 317 388 273L440 201Q477 153 581 166"
                  stroke="#6b6e74"
                  strokeWidth="1"
                  strokeDasharray="8 12"
                />
                <path
                  d="M120 -20L142 101Q146 143 218 154L345 168Q378 172 377 222L375 488"
                  stroke="#303238"
                  strokeWidth="24"
                />
                <path
                  d="M120 -20L142 101Q146 143 218 154L345 168Q378 172 377 222L375 488"
                  stroke="#15171b"
                  strokeWidth="21"
                />
              </svg>
              <div className="pin-halo" />
              <MapPin className="chrome-pin" size={130} strokeWidth={1.2} />
              <div className="map-tag">
                <span className="live-dot" /> THE STARTING LINE
              </div>
              <span className="map-coordinate">EL CONQUISTADOR / PR</span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
