```jsx
import { Suspense } from "react";
import FormsPageContent from "./FormsPageContent";

export default function FormsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "24px" }}>
          Loading forms...
        </div>
      }
    >
      <FormsPageContent />
    </Suspense>
  );
}
```
