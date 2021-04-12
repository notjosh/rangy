import { WrappedSelection } from "@rangy/core";
import Session, { createEntryPointFunction } from "../session";
import { CharacterOptions } from "./create-nested-options";

function createSelectionTrimmer(methodName: string) {
  return createEntryPointFunction(function (
    session: Session,
    characterOptions: Partial<CharacterOptions>
  ): boolean {
    const self = this as WrappedSelection;
    var trimmed = false;
    self.changeEachRange(function (range) {
      trimmed = range[methodName](characterOptions) || trimmed;
    });
    return trimmed;
  });
}

export default createSelectionTrimmer;
