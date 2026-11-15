import {
  makeInstaller,
  ElAlert,
  ElAvatar,
  ElBacktop,
  ElButton,
  ElDialog,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElImage,
  ElImageViewer,
  ElInput,
  ElLoading,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
  ElUpload,
} from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// 仅按需加载全站实际使用到的 Element Plus 组件样式与指令/弹窗样式（替代 357KB 全量 dist/index.css）
import "element-plus/es/components/base/style/css";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/avatar/style/css";
import "element-plus/es/components/backtop/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/divider/style/css";
import "element-plus/es/components/dropdown/style/css";
import "element-plus/es/components/dropdown-item/style/css";
import "element-plus/es/components/dropdown-menu/style/css";
import "element-plus/es/components/empty/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/icon/style/css";
import "element-plus/es/components/image/style/css";
import "element-plus/es/components/image-viewer/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/pagination/style/css";
import "element-plus/es/components/radio-button/style/css";
import "element-plus/es/components/radio-group/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/tab-pane/style/css";
import "element-plus/es/components/tabs/style/css";
import "element-plus/es/components/tag/style/css";
import "element-plus/es/components/upload/style/css";

// 仅注册全站实际使用的 29 个图标（替代全量 ~290+ SVG 图标全注册）
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChatDotRound,
  CircleCheck,
  Clock,
  Close,
  Cpu,
  DataLine,
  Delete,
  Document,
  DocumentCopy,
  EditPen,
  FolderOpened,
  Grid,
  Loading,
  Lock,
  Picture,
  Pointer,
  PriceTag,
  Promotion,
  RefreshRight,
  Search,
  Setting,
  SwitchButton,
  User,
  UserFilled,
  View,
} from "@element-plus/icons-vue";

const usedComponents = [
  ElAlert,
  ElAvatar,
  ElBacktop,
  ElButton,
  ElDialog,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElImage,
  ElImageViewer,
  ElInput,
  ElLoading,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
  ElUpload,
];

const usedIcons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChatDotRound,
  CircleCheck,
  Clock,
  Close,
  Cpu,
  DataLine,
  Delete,
  Document,
  DocumentCopy,
  EditPen,
  FolderOpened,
  Grid,
  Loading,
  Lock,
  Picture,
  Pointer,
  PriceTag,
  Promotion,
  RefreshRight,
  Search,
  Setting,
  SwitchButton,
  User,
  UserFilled,
  View,
};

const installer = makeInstaller(usedComponents);

export function setupElementPlus(app) {
  app.use(installer, { locale: zhCn });
  for (const [name, comp] of Object.entries(usedIcons)) {
    app.component(name, comp);
  }
}

