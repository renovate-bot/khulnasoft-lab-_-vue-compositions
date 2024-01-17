import Channel from '@/useSubscription/models/channel'
import Subscription from '@/useSubscription/models/subscription'
import {
  Action,
  ActionArguments,
  ChannelSignature
} from '@/useSubscription/types/action'
import { SubscriptionOptions } from '@/useSubscription/types/subscription'
import * as useSubscriptionDevtools from '@/useSubscription/useSubscriptionDevtools'

export default class Manager {
  private readonly channels: Map<ChannelSignature, Channel> = new Map()

  public subscribe<T extends Action>(
    action: T,
    args: ActionArguments<T>,
    options: SubscriptionOptions,
  ): Subscription<T> {
    const channel = this.getChannel(action, args)
    const subscription = channel.subscribe(options)

    useSubscriptionDevtools.registerChannelSubscription(channel, subscription.id)

    return subscription
  }

  public deleteChannel(signature: ChannelSignature): void {
    const channel = this.channels.get(signature)
    if (channel) {
      useSubscriptionDevtools.removeChannel(channel)
    }

    this.channels.delete(signature)
  }

  private getChannel<T extends Action>(
    action: T,
    args: ActionArguments<T>,
  ): Channel<T> {
    const channel = new Channel<T>(this, action, args)

    if (this.channels.has(channel.signature)) {
      return this.channels.get(channel.signature)! as Channel<T>
    }

    this.addChannel(channel)

    return channel
  }

  private addChannel(channel: Channel): void {
    this.channels.set(channel.signature, channel)

    useSubscriptionDevtools.addChannel(channel)
  }
}
