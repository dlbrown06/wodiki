const fetchStrengthResultsByAthlete = async (db, athlete_id) => {
  const { rows: strengthRows } = await db.query(
    `
      SELECT
        s.id strength_id,
        s.name strength_name,
        s.strength_date,
        s.created_on,
        m.id movement_id,
        m.name movement_name,
        a.id athlete_id,
        a.email athlete_email,
        a.first_name athlete_first_name,
        a.last_name athlete_last_name,
        a.gender athlete_gender,
        ss.id strength_set_id,
        ss.order_num strength_set_order,
        ssr.id strength_set_result_id,
        ssr.result strength_set_result_result,
        mm.id strength_set_result_measurement_id,
        mm.name strength_set_result_measurement_name,
        mm.abbr strength_set_result_measurement_abbr,
        u.id strength_set_result_measurement_unit_id,
        u.name strength_set_result_measurement_unit_name,
        u.abbr strength_set_result_measurement_unit_abbr
      FROM (
        SELECT
          *
        FROM strength s
        WHERE s.created_by = $1
        ORDER BY s.strength_date DESC, s.created_on DESC
        LIMIT 30
      ) s
      INNER JOIN movements m ON m.id = s.movement_id
      INNER JOIN athletes a ON a.id = s.created_by
      INNER JOIN strength_sets ss ON ss.strength_id = s.id
      INNER JOIN strength_set_results ssr ON ssr.strength_set_id = ss.id
      INNER JOIN measurements mm ON ssr.measurement_id = mm.id
      INNER JOIN units u ON u.id = ssr.unit_id
      ORDER BY s.strength_date DESC, s.created_on DESC, ss.order_num ASC
    `,
    [athlete_id]
  );

  const strength = [];
  strengthRows.forEach(r => {
    // group the strength
    let strengthFound = strength.find(s => s.id === r.strength_id);
    if (!strengthFound) {
      strengthFound = {
        id: r.strength_id,
        name: r.strength_name,
        strength_date: r.strength_date,
        created_on: r.created_on,
        athlete: {},
        movement: {},
        sets: []
      };
      strength.push(strengthFound);
    }

    // group the sets
    let setFound = strengthFound.sets.find(s => s.id === r.strength_set_id);
    if (!setFound) {
      setFound = {
        id: r.strength_set_id,
        order_num: r.strength_set_order,
        results: []
      };
      strengthFound.sets.push(setFound);
    }

    setFound.results.push({
      id: r.strength_set_result_id,
      result: r.strength_set_result_result,
      measurement: {
        id: r.strength_set_result_measurement_id,
        name: r.strength_set_result_measurement_name,
        abbr: r.strength_set_result_measurement_abbr,
        unit: {
          id: r.strength_set_result_measurement_unit_id,
          name: r.strength_set_result_measurement_unit_name,
          abbr: r.strength_set_result_measurement_unit_abbr
        }
      }
    });

    // group the athlete
    if (strengthFound.athlete.id === undefined) {
      strengthFound.athlete = {
        id: r.athlete_id,
        email: r.athlete_email,
        first_name: r.athlete_first_name,
        last_name: r.athlete_last_name,
        gender: r.athlete_gender
      };
    }

    // group the movement
    if (strengthFound.movement.id === undefined) {
      strengthFound.movement = {
        id: r.movement_id,
        name: r.movement_name
      };
    }
  });

  return strength;
};

module.exports = { fetchStrengthResultsByAthlete };
