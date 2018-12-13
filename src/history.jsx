// necessary to push history from all components, see https://stackoverflow.com/questions/42701129/how-to-push-to-history-in-react-router-v4

import { createBrowserHistory } from 'history';

import {isStaticFile} from './common';

export const history = createBrowserHistory();


export function historyPush(url, app) {
  if (isStaticFile()){
    if (!url.startsWith("#")) {
      url = '#'+url
    }
    window.location.hash = url;
    app.router.refresh();
  } else {
    history.push(url);
  }
}
