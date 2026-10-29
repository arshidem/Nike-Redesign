import getApp from '../../backend/app';
export const config = { api: { bodyParser: false, externalResolver: true }, maxDuration: 60 };
export default function handler(req, res) {
  return new Promise(resolve => {
    res.once('finish', resolve);
    res.once('close', resolve);
    getApp()(req, res);
  });
}
