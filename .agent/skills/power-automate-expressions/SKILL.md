---
name: Power Automate Expressions Cheat Sheet
description: A comprehensive cheat sheet for Power Automate expressions, including string manipulation, numbers, dates, arrays, JSON objects, conditions, and data conversion.
---

# The Ultimate Power Automate Expressions Cheat Sheet

**Author:** Tom Riha | 2022 | ver. 1.1

## Working with string / text

### Extract a piece of a string

* **split(string, delimiter)**: Split string by a specific delimiter, returns an array as a result.

  * Example: `split('Power Automate is great', ' ')` => `["Power", "Automate", "is", "great"]`

* **substring(string, startPosition, numberOfCharacters)**: Extract a piece of string using start position and number of characters. First position is 0.

  * Example: `substring('Power Automate is great', 0, 5)` => `"Power"`

* **slice(string, startPosition, endPosition)**: Extract a piece of string using start position and end position. First position is 0.

  * Example: `slice('Power Automate is great', 0, 5)` => `"Power"`

### Build a string

* **concat(string1, string2, ...)**: Build a string from multiple pieces.

  * Example: `concat('Power', ' ', 'Automate')` => `"Power Automate"`

* **join(array, separator)**: Convert an array into a string, items will be separated by a selected separator.

  * Example: `join(array, ';')` => `"a@email.com;b@email.com"`

### Modify a string

* **replace(string, replaceWhat, replaceWith)**: Replace a character/string in a string with another character/string.

* **toLower(string)**: Convert the whole string in lower case letters.

* **toUpper(string)**: Convert the whole string in upper case letters.

* **trim(string)**: Remove empty characters from the beginning and the end of a string, e.g. spaces and new lines.

### Find a character or a string in a string

* **startsWith(string1, string2)**: Check if a string1 starts with the defined string2 (case insensitive).

* **endsWith(string1, string2)**: Check if a string1 ends with the defined string2 (case insensitive).

* **indexOf(string1, string2)**: Check if a string1 contains string2 (or a character) and return its first position. Returns -1 if not found.

* **lastIndexOf(string1, string2)**: Check if a string1 contains string2 (or a character) and return its last position.

* **contains(string1, string2)**: Check if a string1 contains string2 (case sensitive).

### Get string length or check if it's (not) empty

* **length(string or array)**: Return the number of characters in a string or number of items in an array.

* **empty(string or array)**: Check if a string or an array is empty.

### Use a special character

* **decodeUriComponent(value)**: Convert percent encoded URI value into character/string, e.g. new line.

* **encodeUriComponent(value)**: Convert a character/string into percent encoded URI value.

* **uriComponent(value)**: Replace all URI unsafe characters with the percent encoded value.

## Working with numbers

* **add(number1, number2)**: Add two numbers to each other.

* **sub(number1, number2)**: Subtract two numbers.

* **mul(number1, number2)**: Multiply two numbers.

* **div(number1, number2)**: Divide two numbers without decimal places.

* **mod(number1, number2)**: Return the remainder after dividing two numbers.

* **min(array)**: Get the lowest number from an array.

* **max(array)**: Get the highest number from an array.

* **rand(number1, number2)**: Get a random number from a defined range between number1 and number2.

* **formatNumber(number, format, locale)**: Convert string into number with a selected formatting and locale.

## Working with dates (and times)

* **addDays(date, format)**: Add a number of days to a date/time with an optional format.

* **addHours(date, format)**: Add a number of hours to a date/time.

* **addMinutes(date, format)**: Add a number of minutes to a date/time.

* **addSeconds(date, format)**: Add a number of seconds to a date/time.

* **addToTime(date, amount, units, format)**: Add a specified amount of time units to a date/time.

* **getFutureTime(amount, units, format)**: The same as addToTime() but using always the current date/time as the start date.

* **subtractFromTime(date, amount, units, format)**: Subtract a specified amount of time units from a date/time.

* **getPastTime(amount, units, format)**: The same as subtractFromTime() but using always the current date/time as the start date.

* **ticks(date)**: Get the number of ticks (100 nanoseconds) for a date starting from 1.1.0001.

* **utcNow(format)**: Get the current date and time in the UTC time zone in an optional format.

* **startOfMonth(date, format)**: Get the first day of a month at 00:00:00.

* **startOfDay(date, format)**: Get a date at 00:00:00.

* **startOfHour(date, format)**: Get a start of an hour.

* **parseDateTime(date, locale, originalDateFormat)**: Convert any date into ISO format.

* **formatDateTime(date, format)**: Format a date in a specific format.

* **convertTimeZone(date, currentTimeZone, newTimeZone, format)**: Convert a date and time from one time zone into another.

* **convertFromUtc(date, newTimeZone, format)**: The same as convertTimeZone(), but the currentTimeZone is always UTC.

* **dayOfWeek(date)**: Number of day in a week (0 = Sunday).

* **dayOfMonth(date)**: Get the number of the day in a month.

* **dayOfYear(date)**: Get the number of the day in a year.

## Working with arrays

* **intersection(array1, array2)**: Find only items that are in both arrays.

* **union(array1, array2)**: Combine two arrays into one array with all the values, or remove duplicate values from a single array.

* **contains(array, value)**: Check if array contains a specific value.

* **array(string)**: Create an array from a single value.

* **createArray(string1, string2, ...)**: Create an array from multiple values.

* **first(array)**: Take the first item from an array.

* **last(array)**: Take the last item from an array.

* **skip(array, numberToSkip)**: Skip a number of items in an array and take the rest.

* **take(array, numberToTake)**: Take only a specific number of items from an array.

* **sort(array, property)**: Sort an array in ascending order (a-z, 0-9).

* **reverse(array)**: Reverse order of an array.

* **item()**: Get the currently processed item in the current loop.

* **items(actionName)**: Get the currently processed item in a specific loop.

* **range(numberFrom, numberTo)**: Create an array with numbers between two values.

## Working with JSON objects

* **addProperty(json, property, value)**: Add a new property to JSON object. It does NOT update the object automatically.

* **removeProperty(json, property)**: Remove a property from JSON object.

* **setProperty(json, property, value)**: Update a property in JSON object.

* **xpath(xml, path)**: Extract values using the xpath language expression, used mainly in 'Create CSV table', 'Create HTML table' or 'Select'.

## Conditions and logical operations

* **if(condition, ifTrue, ifFalse)**: Evaluate a condition, do something if it's true, something else if it's false.

* **coalesce(value1, value2, ...)**: Take the first non-empty value from the parameters.

* **and(condition1, condition2)**: Check if all conditions are true.

* **or(condition1, condition2)**: Check if at least one condition is true.

* **equals(value1, value2)**: Compare if two values are equal.

* **not(condition)**: Negate the condition result.

* **greater(value1, value2)**: Compare if value1 is greater than the value2.

* **greaterOrEquals(value1, value2)**: Compare if value1 is greater or equal to value2.

* **less(value1, value2)**: Compare if value1 is less than value2.

* **lessOrEquals(value1, value2)**: Compare if value1 is less or equal to value2.

## Data conversion

* **base64ToBinary(string)**: Encode the email attachment from base64 string to binary.

* **string(input)**: Convert the input into string.

* **float(input)**: Convert the input into decimal number.

* **int(input)**: Convert the input into whole number.

* **json(input)**: Convert the input into JSON.

* **xml(input)**: Convert the input into xml.

## Other useful expressions

* **guid()**: Creates a unique identifier.

* **workflow()**: Provides information about the current flow instance.
