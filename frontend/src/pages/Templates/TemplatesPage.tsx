import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { designerActions } from "../../features/designer/designerSlice";
import type { CardTemplate } from "../../shared/types";
import TemplatePage from "../Designer/Templategallery";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector((s: RootState) => !!s.auth.user);

  const handleApply = (tpl: CardTemplate) => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    dispatch(designerActions.applyTemplate(tpl));
    navigate("/designer/new");
  };

  const handleClose = () => navigate("/");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#13161d" }}>
      <TemplatePage
        isHorizontal={true}
        onApply={handleApply}
        onClose={handleClose}
      />
    </div>
  );
}
