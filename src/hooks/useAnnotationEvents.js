/** External Dependencies */
import { useContext, useMemo, useCallback } from 'react';

/** Internal Dependencies */
import AppContext from 'context';
import {
  SET_ANNOTATION,
  SELECT_ANNOTATION,
  CHANGE_POINTER_ICON,
  ENABLE_TEXT_CONTENT_EDIT,
  SELECT_TOOL,
} from 'actions';
import { TOOLS_IDS, POINTER_ICONS, TABS_IDS } from 'utils/constants';
import { useDebouncedCallback } from 'hooks';

const useAnnotationEvents = () => {
  const { tabId, dispatch } = useContext(AppContext);

  const isAnnotationEventsDisabled = useMemo(
    () => tabId !== TABS_IDS.ANNOTATE,
    [tabId],
  );

  const updateAnnotation = useCallback((annotationProps) => {
    dispatch({
      type: SET_ANNOTATION,
      payload: annotationProps,
    });
  }, []);

  const changePointerIcon = useDebouncedCallback((newPointerCssIcon) => {
    dispatch({
      type: CHANGE_POINTER_ICON,
      payload: {
        pointerCssIcon: newPointerCssIcon,
      },
    });
  }, 5);

  const changePointerIconToMoveOrSelect = useCallback((e) => {
    changePointerIcon(
      e.target.draggable() ? POINTER_ICONS.MOVE : POINTER_ICONS.SELECT,
    );
  }, []);

  const changePointerIconToDraw = useCallback(() => {
    changePointerIcon(POINTER_ICONS.DRAW);
  }, []);

  const updatePositionOnDragEnd = useCallback((e) => {
    updateAnnotation({
      id: e.target.id(),
      x: e.target.x(),
      y: e.target.y(),
    });
    changePointerIconToMoveOrSelect(e);
  }, []);

  const getAnnotationTransformProps = useCallback((e) => {
    const transformProps = {
      id: e.target.id(),
      rotation: e.target.rotation(),
      x: e.target.x(),
      y: e.target.y(),
    };

    if (e.target.name() === TOOLS_IDS.TEXT) {
      transformProps.width = e.target.width() * e.target.scaleX();
      transformProps.height = e.target.height() * e.target.scaleY();
      transformProps.scaleX = 1;
      transformProps.scaleY = 1;
    } else {
      transformProps.scaleX = e.target.scaleX();
      transformProps.scaleY = e.target.scaleY();
    }

    return transformProps;
  }, []);

  const updateAnnotationTransform = useCallback((e) => {
    updateAnnotation(getAnnotationTransformProps(e));
  }, []);

  const updateTextAnnotationOnTransform = useCallback((e) => {
    if (e.target.name() === TOOLS_IDS.TEXT) {
      e.target.setAttrs(getAnnotationTransformProps(e));
    }
  });

  const selectAnnotationOnClick = useCallback((e) => {
    dispatch({
      type: SELECT_ANNOTATION,
      payload: {
        annotationId: e.target.id(),
        multiple: e.evt.ctrlKey || e.evt.shiftKey || e.evt.metaKey,
      },
    });
    // TODO: Remove this once we implement the possibility to select annotation
    // while any tool is opened without changing the tool.
    dispatch({
      type: SELECT_TOOL,
      payload: {
        toolId: e.target.name(),
      },
    });
    changePointerIconToMoveOrSelect(e);
  }, []);

  const enableTextContentChangeOnDblClick = useCallback((e) => {
    if (e.target.name() === TOOLS_IDS.TEXT) {
      dispatch({
        type: ENABLE_TEXT_CONTENT_EDIT,
        payload: {
          textIdOfEditableContent: e.target.id(),
        },
      });
    }
  }, []);

  return useMemo(
    () =>
      isAnnotationEventsDisabled
        ? {}
        : {
            onTransform: updateTextAnnotationOnTransform,
            onTransformEnd: updateAnnotationTransform,
            onMouseOver: changePointerIconToMoveOrSelect,
            onMouseLeave: changePointerIconToDraw,
            onDragEnd: updatePositionOnDragEnd,
            onClick: selectAnnotationOnClick,
            onTap: selectAnnotationOnClick,
            onDblClick: enableTextContentChangeOnDblClick,
            onDblTap: enableTextContentChangeOnDblClick,
          },
    [isAnnotationEventsDisabled],
  );
};

export default useAnnotationEvents;
