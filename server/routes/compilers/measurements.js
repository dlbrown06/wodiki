const fetchMeasurementResults = async db => {
  const measurements = [];
  const { rows: measurementRows } = await db.query(
    `
      SELECT
        m.id,
        m.name,
        m.abbr,
        u.id unit_id,
        u.name unit_name,
        u.abbr unit_abbr,
        u.is_metric unit_is_metric
      FROM measurements m
      LEFT JOIN measurement_units mu ON mu.measurement_id = m.id
      LEFT JOIN units u ON u.id = mu.unit_id
      ORDER BY m.name ASC
    `
  );

  measurementRows.forEach(row => {
    const found = measurements.find(item => item.name === row.name);
    if (found) {
      if (row.unit_id) {
        found.units.push({
          id: row.unit_id,
          name: row.unit_name,
          abbr: row.unit_abbr,
          is_metric: row.unit_is_metric
        });
      }
    } else {
      const units = [];
      if (row.unit_id) {
        units.push({
          id: row.unit_id,
          name: row.unit_name,
          abbr: row.unit_abbr,
          is_metric: row.unit_is_metric
        });
      }
      measurements.push({
        id: row.id,
        name: row.name,
        abbr: row.abbr,
        units
      });
    }
  });

  return measurements;
};

module.exports = { fetchMeasurementResults };
