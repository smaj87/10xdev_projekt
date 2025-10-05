import t from 'components/translations/t';
import { useSelector } from 'components/utils/react-redux';

import { getLang } from './selectors';

const useTranslations = () => {
  t.lang = useSelector(getLang); // update on lang change

  return t;
};

export default useTranslations;
