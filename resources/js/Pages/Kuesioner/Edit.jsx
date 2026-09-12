import KuesionerForm from './Partials/KuesionerForm';

export default function Edit({ kuesioner, roles = [] }) {
    return <KuesionerForm kuesioner={kuesioner} roles={roles} mode="edit" />;
}
