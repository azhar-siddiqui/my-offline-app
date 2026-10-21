import Header from "./components/common/header";
import { TaskForm } from "./components/common/task-form";

import ProgressBar from "./components/common/progress-bar";
import TabBar from "./components/common/tab-bar";
import TaskFooter from "./components/common/task-footer";

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-6 pb-24 sm:px-6 sm:pt-8">
        <TaskForm />

        <section className="mt-8" aria-label="Task list">
          <ProgressBar />

          <TabBar />

          <TaskFooter />
        </section>
      </main>
    </div>
  );
}
