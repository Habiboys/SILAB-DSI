import KuesionerForm from './Partials/KuesionerForm';

export default function Create({ roles = [] }) {
    return <KuesionerForm roles={roles} mode="create" />;
}
