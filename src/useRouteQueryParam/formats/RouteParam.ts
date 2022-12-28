import { LocationQueryValue } from 'vue-router'
import { UseRouteQuery } from '@/useRouteQuery/useRouteQuery'
import { InvalidRouteParamValue, isInvalidRouteParamValue, isNotInvalidRouteParamValue } from '@/useRouteQueryParam/formats/InvalidRouteParamValue'
import { asArray } from '@/utilities/arrays'

const IS_ROUTE_PARAM_SYMBOL: unique symbol = Symbol()

// adding any here so RouteParamClass can be used without passing a generic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteParamClass<T = any> = new (key: string, defaultValue: T | T[]) => RouteParam<T>

export function isRouteParamClass(value: unknown): value is RouteParamClass<unknown> {
  return typeof value === 'function' && 'IS_ROUTE_PARAM' in value && value.IS_ROUTE_PARAM == IS_ROUTE_PARAM_SYMBOL
}

export function isNotRouteParamClass<T>(value: T | RouteParamClass): value is T {
  return !isRouteParamClass(value)
}

export abstract class RouteParam<T> {
  public static IS_ROUTE_PARAM = IS_ROUTE_PARAM_SYMBOL

  protected abstract parse(value: LocationQueryValue): T
  protected abstract format(value: T): LocationQueryValue

  protected key: string
  protected defaultValue: T | T[]

  private get multiple(): boolean {
    return Array.isArray(this.defaultValue)
  }

  public constructor(key: string, defaultValue: T | T[]) {
    this.key = key
    this.defaultValue = defaultValue
  }

  public get(routeQuery: UseRouteQuery): T | T[] {
    if (!(this.key in routeQuery.query)) {
      return this.defaultValue
    }

    const strings = asArray(routeQuery.get(this.key))
    const values = strings.map(value => this.safeParseValue(value)).filter(isNotInvalidRouteParamValue)

    if (this.multiple) {
      return values
    }

    const [first] = values

    return first
  }

  public set(routeQuery: UseRouteQuery, value: T | T[]): void {
    const values = asArray(value)
    const strings = values.map(value => this.safeFormatValue(value)).filter(isNotInvalidRouteParamValue)

    if (this.multiple) {
      this.defaultValue = []
    }

    if (strings.length === 0) {
      return routeQuery.remove(this.key)
    }

    if (this.multiple) {
      return routeQuery.set(this.key, strings)
    }

    const [first] = strings

    routeQuery.set(this.key, first)
  }

  private safeParseValue(value: LocationQueryValue): T | InvalidRouteParamValue {
    try {
      return this.parse(value)
    } catch (error) {
      if (!isInvalidRouteParamValue(error)) {
        console.error(error)
      }

      return new InvalidRouteParamValue()
    }
  }

  private safeFormatValue(value: T): LocationQueryValue | InvalidRouteParamValue {
    try {
      return this.format(value)
    } catch (error) {
      if (!isInvalidRouteParamValue(error)) {
        console.error(error)
      }

      return new InvalidRouteParamValue()
    }
  }

}