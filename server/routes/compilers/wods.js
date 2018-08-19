const fetchWODResultsByAthlete = async (db, athlete_id) => {
  const { rows: wodRows } = await db.query(
    `
      SELECT
        w.id wod_id,
        w.name wod_name,
        w.as_prescribed,
        w.is_record,
        w.wod_date,
        w.created_on,
        wt.id wod_type_id,
        wt.name wod_type_name,
        wt.abbr wod_type_abbr,
        m.id wod_movement_id,
        m.name wod_movement_name,
        wm.order_num wod_movement_order,
        wmr.result wod_movement_result,
        mm.id wod_movement_result_measurement_id,
        mm.name wod_movement_result_measurement_name,
        mm.abbr wod_movement_result_measurement_abbr,
        u.id wod_movement_result_measurement_unit_id,
        u.name wod_movement_result_measurement_unit_name,
        u.abbr wod_movement_result_measurement_unit_abbr,
        u.is_metric wod_movement_result_measurement_unit_is_metric,
        a.id athlete_id,
        a.email athlete_email,
        a.first_name athlete_first_name,
        a.last_name athlete_last_name,
        a.gender athlete_gender,
        wtmr.id wod_type_measurement_result_id,
        wtmr.result wod_type_measurement_result_result,
        u2.id wod_type_measurement_result_unit_id,
        u2.name wod_type_measurement_result_unit_name,
        u2.abbr wod_type_measurement_result_unit_abbr
      FROM (
        SELECT
          *
        FROM wods w
        WHERE w.created_by = $1
        ORDER BY w.wod_date DESC, w.created_on DESC
        LIMIT 30
      ) w
      INNER JOIN wod_types wt ON wt.id = w.wod_type_id
      INNER JOIN wod_movements wm ON wm.wod_id = w.id
      INNER JOIN movements m on m.id = wm.movement_id
      INNER JOIN wod_movement_results wmr on wmr.wod_movement_id = wm.id
      INNER JOIN measurements mm on mm.id = wmr.measurement_id
      INNER JOIN measurement_units mu ON mu.measurement_id = mm.id
      INNER JOIN units u ON u.id = mu.unit_id
      INNER JOIN athletes a on w.created_by = a.id
      INNER JOIN wod_type_measurements wtm ON wtm.wod_type_id = wt.id
      INNER JOIN wod_type_measurement_results wtmr ON wtmr.wod_id = w.id AND wtmr.wod_type_measurement_id = wtm.id
      INNER  JOIN units u2 ON u2.id = wtmr.unit_id
      ORDER BY w.wod_date DESC, w.created_on DESC, wm.order_num ASC
    `,
    [athlete_id]
  );

  const wods = [];
  wodRows.forEach(r => {
    // group the wods
    let wodFound = wods.find(w => w.id === r.wod_id);
    if (!wodFound) {
      wodFound = {
        id: r.wod_id,
        name: r.wod_name,
        as_prescribed: r.as_prescribed,
        is_record: r.is_record,
        wod_date: r.wod_date,
        created_on: r.created_on,
        type: {},
        athlete: {},
        movements: [],
        score: []
      };
      wods.push(wodFound);
    }

    // group the movements
    let movementFound = wodFound.movements.find(
      m => m.id === r.wod_movement_id
    );
    if (!movementFound) {
      movementFound = {
        id: r.wod_movement_id,
        name: r.wod_movement_name,
        order_num: r.wod_movement_order,
        result: r.wod_movement_result,
        measurement: {
          id: r.wod_movement_result_measurement_id,
          name: r.wod_movement_result_measurement_name,
          abbr: r.wod_movement_result_measurement_abbr,
          unit: {
            id: r.wod_movement_result_measurement_unit_id,
            name: r.wod_movement_result_measurement_unit_name,
            abbr: r.wod_movement_result_measurement_unit_abbr
          }
        }
      };
      wodFound.movements.push(movementFound);
    }

    // group the athlete
    if (wodFound.athlete.id === undefined) {
      wodFound.athlete = {
        id: r.athlete_id,
        email: r.athlete_email,
        first_name: r.athlete_first_name,
        last_name: r.athlete_last_name,
        gender: r.athlete_gender
      };
    }

    // group the wod type
    if (wodFound.type.id === undefined) {
      wodFound.type = {
        id: r.wod_type_id,
        name: r.wod_type_name,
        abbr: r.wod_type_abbr
      };
    }

    let wodResultFound = wodFound.score.find(
      s => s.id === s.wod_type_measurement_result_id
    );
    if (!wodResultFound) {
      wodResultFound = {
        id: r.wod_type_measurement_result_id,
        result: r.wod_type_measurement_result_result,
        unit: {
          id: r.wod_type_measurement_result_unit_id,
          name: r.wod_type_measurement_result_unit_name,
          abbr: r.wod_type_measurement_result_unit_abbr
        }
      };
      wodFound.score.push(wodResultFound);
    }
  });

  return wods;
};

module.exports = { fetchWODResultsByAthlete };
