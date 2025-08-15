require('module-alias/register');
require('dotenv').config();
import App from "./app"
import IndexRoute from "./modules/index/index.route"
import 'reflect-metadata';
import EvaluateRoute from "@modules/evaluate/route";
import EventStorageRoute from "@modules/event_storage/route";
import ReportRoute from "@modules/report/route";
import LikeRatingRoute from "@modules/likeRating/route";

const routes = [
    new IndexRoute(),
    new EventStorageRoute(),
    new EvaluateRoute(),
    new ReportRoute(),
    new LikeRatingRoute(),
];
const app = new App(routes);

app.listen();