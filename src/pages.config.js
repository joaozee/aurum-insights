/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Community from './pages/Community';
import Company from './pages/Company';
import CompanyAbout from './pages/CompanyAbout';
import ContentDetail from './pages/ContentDetail';
import Contents from './pages/Contents';
import CourseDetail from './pages/CourseDetail';
import CourseExam from './pages/CourseExam';
import CoursePlayer from './pages/CoursePlayer';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import FavoriteLessons from './pages/FavoriteLessons';
import FinancialAssistant from './pages/FinancialAssistant';
import FinancialPlanner from './pages/FinancialPlanner';
import FinancialReports from './pages/FinancialReports';
import FreeCourseDetail from './pages/FreeCourseDetail';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Help from './pages/Help';
import Home from './pages/Home';
import InstructorDashboard from './pages/InstructorDashboard';
import Leaderboard from './pages/Leaderboard';
import Learn from './pages/Learn';
import Messages from './pages/Messages';
import MyCourses from './pages/MyCourses';
import MyGroups from './pages/MyGroups';
import Network from './pages/Network';
import News from './pages/News';
import NotificationHistory from './pages/NotificationHistory';
import Portfolio from './pages/Portfolio';
import Premium from './pages/Premium';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import PublicProfile from './pages/PublicProfile';
import Reports from './pages/Reports';
import SavedItems from './pages/SavedItems';
import Support from './pages/Support';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Community": Community,
    "Company": Company,
    "CompanyAbout": CompanyAbout,
    "ContentDetail": ContentDetail,
    "Contents": Contents,
    "CourseDetail": CourseDetail,
    "CourseExam": CourseExam,
    "CoursePlayer": CoursePlayer,
    "Courses": Courses,
    "Dashboard": Dashboard,
    "FavoriteLessons": FavoriteLessons,
    "FinancialAssistant": FinancialAssistant,
    "FinancialPlanner": FinancialPlanner,
    "FinancialReports": FinancialReports,
    "FreeCourseDetail": FreeCourseDetail,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "Help": Help,
    "Home": Home,
    "InstructorDashboard": InstructorDashboard,
    "Leaderboard": Leaderboard,
    "Learn": Learn,
    "Messages": Messages,
    "MyCourses": MyCourses,
    "MyGroups": MyGroups,
    "Network": Network,
    "News": News,
    "NotificationHistory": NotificationHistory,
    "Portfolio": Portfolio,
    "Premium": Premium,
    "Privacy": Privacy,
    "Profile": Profile,
    "ProfileSettings": ProfileSettings,
    "PublicProfile": PublicProfile,
    "Reports": Reports,
    "SavedItems": SavedItems,
    "Support": Support,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};