export function WeekSchedule() {
  return (
    <>
      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">This week · May 12–18</span>
        <span className="rule" />
        <button className="btn btn-secondary btn-sm">+ Block time</button>
      </div>

      <div className="week-grid" style={{ marginBottom: 32 }}>
        <div className="wg-head" style={{ background: "var(--slate-50)", borderRight: "1px solid var(--border)" }} />
        <div className="wg-head">MON<b>12</b></div>
        <div className="wg-head today">TUE<b>13</b></div>
        <div className="wg-head">WED<b>14</b></div>
        <div className="wg-head">THU<b>15</b></div>
        <div className="wg-head">FRI<b>16</b></div>
        <div className="wg-head">SAT<b>17</b></div>
        <div className="wg-head">SUN<b>18</b></div>

        <div className="wg-time">8AM</div>
        <div className="wg-slot"><div className="wg-event book"><b>8:00</b>Water heater · Mason</div></div>
        <div className="wg-slot"><div className="wg-event book"><b>7:00–11</b>HVAC inspect</div></div>
        <div className="wg-slot"><div className="wg-event">Repipe est.</div></div>
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event book"><b>8:30</b>Drain clean · Lin</div></div>
        <div className="wg-slot off"><div className="wg-event off">OFF</div></div>
        <div className="wg-slot off"><div className="wg-event off">OFF</div></div>

        <div className="wg-time">10</div>
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event warn"><b>10:48</b>FIX-2418 · ON SITE</div></div>
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event book"><b>10:00</b>Faucet · Howard St</div></div>
        <div className="wg-slot" />
        <div className="wg-slot off" />
        <div className="wg-slot off" />

        <div className="wg-time">12PM</div>
        <div className="wg-slot"><div className="wg-event">Lunch buffer</div></div>
        <div className="wg-slot"><div className="wg-event">Lunch</div></div>
        <div className="wg-slot"><div className="wg-event">Lunch</div></div>
        <div className="wg-slot"><div className="wg-event">Lunch</div></div>
        <div className="wg-slot"><div className="wg-event">Lunch</div></div>
        <div className="wg-slot off" />
        <div className="wg-slot off" />

        <div className="wg-time">2</div>
        <div className="wg-slot"><div className="wg-event book"><b>2:00–5</b>Re-pipe · 14th &amp; Howard</div></div>
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event book"><b>2:00</b>Disposal swap</div></div>
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event book"><b>2:30</b>Sump install</div></div>
        <div className="wg-slot off" />
        <div className="wg-slot off" />

        <div className="wg-time">4</div>
        <div className="wg-slot" />
        <div className="wg-slot" />
        <div className="wg-slot" />
        <div className="wg-slot"><div className="wg-event book"><b>4:00</b>Inspection · Bldg A</div></div>
        <div className="wg-slot" />
        <div className="wg-slot off" />
        <div className="wg-slot off" />
      </div>
    </>
  );
}
