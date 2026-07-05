## Plan: make the Messages section align cleanly

### What I’ll fix
1. **Prevent the left conversation column from clipping text**
   - Widen the conversation list at this viewport.
   - Add stronger `min-w-0`, `truncate`, and overflow rules so organization names, subtitles, timestamps, and previews stay inside the column.
   - Make active rows align consistently with the search field and list padding.

2. **Clean up the chat window alignment**
   - Reduce uneven horizontal padding in the header, message list, and composer so all chat content starts on a consistent vertical line.
   - Keep the header avatar/name/actions from squeezing or breaking when the selected organization name is long.

3. **Fix broken-looking message text**
   - Set message bubbles to use responsive widths and safe word wrapping so messages wrap naturally instead of looking cut or awkward.
   - Avoid overly narrow bubbles when the chat panel is squeezed.

4. **Improve composer alignment**
   - Align the reply box with the message stream.
   - Keep the send button and helper text from crowding or stretching the composer at smaller widths.

### Technical details
- Update only the Messages UI files:
  - `src/routes/messages.tsx`
  - `src/routes/organizations.$id.messages.tsx`
  - `src/components/messages/ConversationList.tsx`
  - `src/components/messages/ChatHeader.tsx`
  - `src/components/messages/MessageList.tsx`
  - `src/components/messages/MessageComposer.tsx`
- No navigation, data, meetings, or backend changes.
- After implementation, verify the `/organizations/gch-nike/messages` view at the current 1189px-wide layout.