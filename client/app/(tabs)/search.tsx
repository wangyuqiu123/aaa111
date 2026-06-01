// 搜索功能已移除，跳转到首页
import { Redirect } from 'expo-router';

export default function SearchTab() {
  return <Redirect href="/" />;
}
