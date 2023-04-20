import styles from './index.module.css';
import { api } from '@/utils/api';

const FactoryMenu: React.FC<{ factoryId?: string; }> = ({ factoryId }) => {
	const factory = api.factory.getById.useQuery({ id: factoryId ?? '' }, {
		enabled: Boolean(factoryId),
		refetchOnWindowFocus: false
	});

	return factory.data
		? <div className={styles['factory-menu']}>
			<span className={styles['factory-menu__name']}>{factory.data.name}</span>
		</div>
		: null;
};

export default FactoryMenu;