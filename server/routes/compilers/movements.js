const fetchMovementResults = async db => {
  const movements = [];
  let { rows: movementRows } = await db.query(
    `
      SELECT
        m.id movement_id,
        m.name movement_name,
        m2.id measurement_id,
        m2.name measurement_name,
        m2.abbr measurement_abbr,
        u.id measurement_unit_id,
        u.name measurement_unit_name,
        u.abbr measurement_unit_abbr,
        u.is_metric measurement_unit_is_metric
      FROM movements m
      INNER JOIN movement_measurements mm ON mm.movement_id = m.id
      INNER JOIN measurements m2 on mm.measurement_id = m2.id
      INNER JOIN measurement_units mu on m2.id = mu.measurement_id
      INNER JOIN units u on u.id = mu.unit_id
      ORDER BY m.name ASC, m2.name ASC, u.name ASC
    `
  );

  movementRows.forEach(r => {
    // group the movements
    let movementFound = movements.find(m => m.id === r.movement_id);
    if (!movementFound) {
      movementFound = {
        id: r.movement_id,
        name: r.movement_name,
        measurements: []
      };
      movements.push(movementFound);
    }

    // group the measurements
    let measurementFound = movementFound.measurements.find(
      m => m.id === r.measurement_id
    );
    let unit = {
      id: r.measurement_unit_id,
      name: r.measurement_unit_name,
      abbr: r.measurement_unit_abbr,
      is_metric: r.measurement_unit_is_metric,
    };

    if (!measurementFound) {
      measurementFound = {
        id: r.measurement_id,
        name: r.measurement_name,
        abbr: r.measurement_abbr,
        units: [unit]
      };
      movementFound.measurements.push(measurementFound);
    } else {
      measurementFound.units.push(unit);
    }
  });

  return movements;
};

module.exports = { fetchMovementResults };
