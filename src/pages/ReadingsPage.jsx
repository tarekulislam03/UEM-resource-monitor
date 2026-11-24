import ReadingsTable from '../components/ReadingsTable';

export default function ReadingsPage({
  readings,
  buildings,
  onDeleteReading,
}) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Readings</h1>
          <p className="page-header__subtitle">
            All recorded monthly electricity and water entries
          </p>
        </div>
      </header>

      <ReadingsTable
        readings={readings}
        buildings={buildings}
        onDeleteReading={onDeleteReading}
      />
    </>
  );
}
