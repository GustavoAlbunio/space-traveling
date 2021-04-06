import { ReactElement } from 'react';
import Link from 'next/link';

import styles from './header.module.scss';
import commonStyles from '../../styles/common.module.scss';

export default function Header(): ReactElement {
  return (
    <header className={`${commonStyles.container} ${styles.headerContainer}`}>
      <Link href="/">
        <a>
          <img src="/spacetraveling_logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
